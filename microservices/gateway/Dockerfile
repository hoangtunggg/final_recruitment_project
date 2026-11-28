FROM nginx:1.27.4-alpine3.21
COPY gateway/nginx.conf /etc/nginx/nginx.conf
COPY gateway/proxy_params.conf /etc/nginx/proxy_params.conf
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && chown -R nginx:nginx /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=4 CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
