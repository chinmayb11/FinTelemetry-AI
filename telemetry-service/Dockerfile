# Stage 1: Build the Java application using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# 1. Copy ONLY the pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copy the source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the compiled application
FROM eclipse-temurin:17-jre-alpine
VOLUME /tmp
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]