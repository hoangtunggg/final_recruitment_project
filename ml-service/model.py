"""The sole trainable architecture: shared Unicode BiGRU with masked attention."""
import tensorflow as tf
from tensorflow.keras import layers


def standardize(text):
    # Preserve Unicode letters, digits, accents and technical punctuation.
    return tf.strings.regex_replace(tf.strings.lower(text), r"[^\p{L}\p{N}+#.\-\s]", " ")


@tf.keras.utils.register_keras_serializable(package="jobportal")
class AttentionPooling(layers.Layer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.score = layers.Dense(1)
        self.supports_masking = True

    def build(self, input_shape):
        self.score.build(input_shape)
        super().build(input_shape)

    def call(self, values, mask=None):
        logits = tf.squeeze(self.score(values), -1)
        if mask is not None:
            logits = tf.where(mask, logits, tf.cast(-1e9, logits.dtype))
        weights = tf.nn.softmax(logits, axis=1)
        return tf.reduce_sum(values * tf.expand_dims(weights, -1), axis=1)

    def compute_mask(self, inputs, mask=None):
        return None


@tf.keras.utils.register_keras_serializable(package="jobportal")
class PairFeatures(layers.Layer):
    def call(self, inputs):
        a, b = inputs
        return tf.concat([a, b, tf.abs(a-b), a*b], axis=-1)


@tf.keras.utils.register_keras_serializable(package="jobportal")
class GradedPairwiseLoss(tf.keras.losses.Loss):
    """Soft-label BCE plus within-JD ordering; the network architecture is unchanged."""
    def __init__(self, ranking_weight=0.25, margin=0.15, name="graded_pairwise_loss"):
        super().__init__(name=name)
        self.ranking_weight = ranking_weight
        self.margin = margin

    def call(self, y_true, y_pred):
        target = tf.cast(y_true[:, 0], y_pred.dtype)
        group = y_true[:, 1]
        score = tf.reshape(y_pred, [-1])
        pointwise = tf.reduce_mean(tf.keras.losses.binary_crossentropy(target, score))
        target_delta = target[:, None] - target[None, :]
        score_delta = score[:, None] - score[None, :]
        same_group = tf.equal(group[:, None], group[None, :])
        ordered = tf.abs(target_delta) >= self.margin
        upper = tf.linalg.band_part(tf.ones_like(target_delta, dtype=tf.bool), 0, -1)
        upper = tf.logical_and(upper, tf.logical_not(tf.eye(tf.shape(target)[0], dtype=tf.bool)))
        mask = tf.logical_and(tf.logical_and(same_group, ordered), upper)
        signed = tf.sign(target_delta) * score_delta
        rank_losses = tf.boolean_mask(tf.nn.softplus(-signed), mask)
        ranking = tf.cond(tf.size(rank_losses) > 0,
                          lambda: tf.reduce_mean(rank_losses),
                          lambda: tf.cast(0.0, y_pred.dtype))
        return pointwise + self.ranking_weight * ranking

    def get_config(self):
        return {**super().get_config(), "ranking_weight":self.ranking_weight, "margin":self.margin}


def build_model(vocab_size=30000, embedding_dim=128, gru_units=64, dropout=0.3,
                cv_length=512, jd_length=256, learning_rate=0.001,
                objective="binary", ranking_weight=0.25):
    cv = layers.Input(shape=(cv_length,), dtype="int32", name="cv")
    jd = layers.Input(shape=(jd_length,), dtype="int32", name="jd")
    embedding = layers.Embedding(vocab_size, embedding_dim, mask_zero=True)
    encoder = layers.Bidirectional(layers.GRU(gru_units, return_sequences=True))
    attention = AttentionPooling()

    def encode(tokens):
        return attention(encoder(embedding(tokens)))

    features = PairFeatures()([encode(cv), encode(jd)])
    x = layers.Dense(128, activation="relu")(features)
    x = layers.Dropout(dropout)(x)
    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(dropout)(x)
    output = layers.Dense(1, activation="sigmoid", name="relevance")(x)
    model = tf.keras.Model([cv, jd], output, name="siamese_bigru_attention")
    loss = GradedPairwiseLoss(ranking_weight=ranking_weight) if objective == "graded_pairwise" else "binary_crossentropy"
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate), loss=loss)
    return model
