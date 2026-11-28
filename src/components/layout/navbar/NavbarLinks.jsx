import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const VARIANT_CLASSES = {
  desktop: "min-h-11 rounded-pill px-4 text-sm font-semibold",
  mobile: "min-h-11 w-full rounded-control px-3 text-base font-semibold",
};

/**
 * Public top navigation links built from useNavItems().
 * Props: items, variant "desktop" | "mobile".
 */
const NavbarLinks = ({ items, variant = "desktop" }) => {
  const { t } = useTranslation("common");
  return items.map(({ key, labelKey, to, active, onClick }) => (
    <Link
      key={key}
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      data-testid={`nav-${key}`}
      className={`inline-flex items-center transition-colors ${VARIANT_CLASSES[variant]} ${
        active
          ? "bg-primary-50 text-primary-text dark:bg-primary-900/40"
          : "text-ink hover:bg-tint hover:text-primary-text"
      }`}
    >
      {t(labelKey)}
    </Link>
  ));
};

export default NavbarLinks;
