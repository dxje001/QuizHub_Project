# Fix CORS Issue on AWS EC2

## Problem
The error message shows:
```
The 'Access-Control-Allow-Origin' header contains multiple values 'http://localhost:3050, *'
```

This happens because BOTH Nginx AND the ASP.NET Core backend are adding CORS headers.

## Solution
Update Nginx to hide the backend CORS headers and only use its own.

---

## Steps to Fix (Using EC2 Instance Connect)

### 1. Connect to EC2
- AWS Console → EC2 → Instances
- Select `kvizhub-instance`
- Click "Connect" → "EC2 Instance Connect" → "Connect"

### 2. Update Nginx Configuration

Copy and paste this **entire script** into the EC2 terminal:

```bash
cd ~/kvizhub

# Backup current config
cp nginx-aws.conf nginx-aws.conf.backup

# Create new fixed config
cat > nginx-aws.conf << 'NGINXCONF'
events {
    worker_connections 1024;
}

http {
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    upstream auth_service {
        server auth-service:8080;
    }

    upstream quiz_service {
        server quiz-service:8080;
    }

    upstream execution_service {
        server execution-service:8080;
    }

    server {
        listen 80;
        server_name _;

        location /health {
            access_log off;
            return 200 "Microservices Gateway OK\n";
            add_header Content-Type text/plain;
        }

        location /api/auth {
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;

            proxy_pass http://auth_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/(?!.*/(submit|take|attempts)) {
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;

            proxy_pass http://quiz_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/.*/take {
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;

            proxy_pass http://execution_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/.*/submit {
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;

            proxy_pass http://execution_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 300s;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/(attempts|leaderboard) {
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;

            proxy_pass http://execution_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location /api/ {
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Methods;
            proxy_hide_header Access-Control-Allow-Headers;
            proxy_hide_header Access-Control-Allow-Credentials;

            proxy_pass http://quiz_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
    }
}
NGINXCONF

echo ""
echo "Config updated! Restarting nginx..."

# Restart nginx container to apply changes
docker-compose restart nginx-gateway

echo ""
echo "Waiting for nginx to restart..."
sleep 5

echo ""
echo "Testing..."
curl http://localhost/health

echo ""
echo "Done! CORS should now be fixed."
echo ""
echo "Test from your browser at http://54.196.182.219/api/quiz"
```

### 3. Verify Fix

After running the script, test in your browser console (F12 → Console):

```javascript
fetch('http://54.196.182.219/api/quiz')
  .then(r => r.json())
  .then(data => console.log('Success!', data))
  .catch(err => console.error('Error:', err))
```

**Should now work without CORS error!**

---

## What Changed?

Added these lines to each location block:
```nginx
proxy_hide_header Access-Control-Allow-Origin;
proxy_hide_header Access-Control-Allow-Methods;
proxy_hide_header Access-Control-Allow-Headers;
proxy_hide_header Access-Control-Allow-Credentials;
```

This tells Nginx to **remove** CORS headers from the backend response before adding its own, preventing duplicate headers.

---

## Verify It Worked

1. **In browser, open:** http://localhost:3050/
2. **In Network tab:** Should see requests to `54.196.182.219`
3. **No CORS errors** in console
4. **Application loads** quizzes successfully

---

## If Still Not Working

Check the Response Headers in Network tab:
1. Click on "quiz" request
2. Go to "Headers" tab
3. Look at "Response Headers"
4. Should see **only ONE** `access-control-allow-origin: *`
5. If you see TWO, the fix didn't apply - restart nginx again:
   ```bash
   docker-compose restart nginx-gateway
   ```
