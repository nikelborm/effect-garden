import { $ } from 'bun'

await $`sudo mkdir -p certbot/conf/dhparam certbot/www certbot/logs`

await $`sudo docker run -it --rm \
  ${Object.entries({
    www: '/var/www/certbot/',
    conf: '/etc/letsencrypt/',
    logs: '/var/log/letsencrypt/',
  })
    .map(([k, v]) => `-v ./certbot/${k}/:${v}:rw`)
    .join(' ')} \
  -p 80:80 \
  certbot/certbot \
  certonly --text --non-interactive --standalone --domain 10111897.xyz --webroot-path /var/www/certbot/ --agree-tos --email humped-churn-wipe@duck.com`

await $`sudo openssl dhparam -out ./certbot/conf/dhparam/dhparam.pem 4096`
