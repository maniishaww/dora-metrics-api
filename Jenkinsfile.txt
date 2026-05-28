pipeline {
    agent any

    environment {
        IMAGE_NAME = 'dora-metrics-api'
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_PROJECT_KEY = 'dora-metrics-api'
    }

    stages {

        stage('Build') {
            steps {
                echo "Building DORA Metrics API - Build #${BUILD_NUMBER}"
                bat 'docker build -t %IMAGE_NAME%:%IMAGE_TAG% .'
                bat 'docker tag %IMAGE_NAME%:%IMAGE_TAG% %IMAGE_NAME%:latest'
                echo "Docker image built and tagged successfully"
            }
        }

        stage('Test') {
            steps {
                echo "Running automated tests with coverage..."
                bat 'npm install --ignore-scripts'
                bat 'npm test'
            }
            post {
                always {
                    echo "Test stage completed"
                }
            }
        }

        stage('Code Quality') {
            steps {
                echo "Running SonarQube code quality analysis..."
                withSonarQubeEnv('SonarQube') {
                    bat '''
                        sonar-scanner ^
                        -Dsonar.projectKey=dora-metrics-api ^
                        -Dsonar.sources=src ^
                        -Dsonar.tests=tests ^
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    '''
                }
            }
        }

        stage('Security Scan') {
            steps {
                echo "Running security scan with Trivy..."
                bat 'docker run --rm aquasec/trivy:latest image --exit-code 0 --severity LOW,MEDIUM,HIGH,CRITICAL %IMAGE_NAME%:latest'
                echo "Security scan completed"
            }
        }

        stage('Deploy to Staging') {
            steps {
                echo "Deploying to staging environment..."
                bat 'docker-compose down --remove-orphans || exit /b 0'
                bat 'docker-compose up -d app'
                bat 'timeout /t 15 /nobreak'
                bat 'docker inspect --format="{{.State.Health.Status}}" dora-api'
                echo "Application deployed to staging on port 3000"
            }
        }

        stage('Release') {
            steps {
                echo "Promoting to production release..."
                bat 'docker tag %IMAGE_NAME%:latest %IMAGE_NAME%:prod-%IMAGE_TAG%'
                bat 'git tag -a v1.%BUILD_NUMBER% -m "Release v1.%BUILD_NUMBER%" || exit /b 0'
                echo "Released as v1.%BUILD_NUMBER%"
            }
        }

        stage('Monitoring') {
            steps {
                echo "Starting monitoring stack..."
                bat 'docker-compose up -d prometheus grafana'
                bat 'timeout /t 10 /nobreak'
                echo "Prometheus available at http://localhost:9090"
                echo "Grafana available at http://localhost:3001"
                echo "Monitoring stack is live"
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully!"
            echo "App: http://localhost:3000/health"
            echo "Metrics: http://localhost:3000/metrics"
            echo "Grafana: http://localhost:3001"
        }
        failure {
            echo "Pipeline failed! Check the logs above for details."
        }
        always {
            echo "Pipeline finished - Build #${BUILD_NUMBER}"
        }
    }
}