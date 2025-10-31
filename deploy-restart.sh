cat > ~/deploy/react-frontend/deploy-restart.sh <<'EOF'
#!/bin/bash
set -e

IMAGE_TAR="/home/ec2-user/react-frontend.tar"
IMAGE_NAME="react-frontend"
CONTAINER_NAME="react-frontend"
PORT=80

# load image
if [ -f "$IMAGE_TAR" ]; then
  docker load -i "$IMAGE_TAR"
fi

# (optional) pull latest if using registry:
# docker pull mydockerhubuser/react-frontend:latest

# stop & remove existing container
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

# run new container (exposing port 80)
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p ${PORT}:80 \
  react-frontend:latest

# print status
echo "Deployed image $(docker images | head -n 5)"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
EOF

chmod +x ~/deploy/react-frontend/deploy-restart.sh
