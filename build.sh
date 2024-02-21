#!/bin/bash

as_build_mode=$1

while [ true ]; do

  if [ -z "$as_build_mode" ]; then
    read -p "(deploy/debug): " as_build_mode
  fi

  if [ "$as_build_mode" == "deploy" ]; then

    echo "Architecture (386/amd64/arm/arm64):"
    read -p " > " as_arch

    echo "Platform (windows/linux):"
    read -p " > " as_platform

    env GOOS=$as_platform GOARCH=$as_arch go build -o deploy-srv

  elif [ "$as_build_mode" == "debug" ]; then

    echo "Building Debug-Server..."
    go build -o debug-srv

    echo "Launching Debug-Server..."
    ./debug-srv

    echo "Disposing Debug Server..."
    rm debug-srv

  else
    continue
  fi

  echo "Done."
  sleep "1s"
  break

done
