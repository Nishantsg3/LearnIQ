# Stage 1: Build executable JAR using Java 17 JDK and Maven wrapper
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

COPY . .

RUN chmod +x mvnw

RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image using Java 17 JRE
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy executable JAR from builder stage
COPY --from=builder /app/target/learniq-backend-0.0.1-SNAPSHOT.jar app.jar

# Reconciled JVM memory configuration for Render 512 MB container:
# - SerialGC: Minimizes GC native memory footprint (no G1 card tables/parallel thread overhead)
# - TieredStopAtLevel=1: C1 compilation only; accelerates startup and keeps CodeCache small (~15-20 MB)
# - Xmx256m: Explicit conservative 256 MB maximum heap (50% of container RAM)
# - MaxMetaspaceSize=128m: Bounds Metaspace with comfortable headroom (~70-85 MB typical)
# - Xss512k: Halves per-thread stack memory to reduce overhead across Tomcat/worker threads
# - ExitOnOutOfMemoryError: Forces clean container restart if OOM occurs
# Configured via JAVA_TOOL_OPTIONS to match Render environment variable
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xmx256m -XX:MaxMetaspaceSize=128m -Xss512k -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
