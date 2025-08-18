# Docker-compose only builds the image once, and thereafter caches it.
all: build run

build:
	bash -c "docker-compose build"

run:
	bash -c "docker-compose up"

stop:
	bash -c "docker-compose down"
