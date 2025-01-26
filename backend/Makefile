build:
	go build -o Forum_Project ./cmd/main.go && go build -o buildDb ./cmd/buildDb/main.go && go build -o populateDb ./cmd/buildDb/populateDb/main.go 
migrate:
	./buildDb
seed:
	./populateDb
run: 
	cd cmd/main && go run main.go
all: migrate seed run
