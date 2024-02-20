#!/bin/bash

echo "Building Server..."
go build -o debug-srv

echo "Launching Server..."
./debug-srv

echo "Disposing Server..."
rm debug-srv

echo "Done."
sleep "1s"
