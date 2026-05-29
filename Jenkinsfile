pipeline {
    agent any

    environment {
        IMAGE_NAME = 'dora-metrics-api'
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_SCANNER_HOME = tool 'SonarScanner'
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
                    bat "%SONAR_SCANNER_HOME%\\bin\\sonar-scanner.bat -Dsonar.projectKey=dora-metrics-api -Dsonar.sources=src -Dsonar.tests=tests"
                }
            }
        }

stage('Security Scan') {
            steps {
                echo "Running security scan with npm audit..."
                bat 'npm audit --audit-level=moderate || exit /b 0'
                bat 'docker run --rm -v "%cd%":/workspace aquasec/trivy:latest fs --exit-code 0 --severity HIGH,CRITICAL /workspace || exit /b 0'
                echo "Security scan completed"
            }
        }
      
        stage('Deploy to Staging') {
            steps {
                echo "Deploying to staging environment..."
                bat 'docker-compose down --remove-orphans || exit /b 0'
                bat 'docker-compose up -d app'
                bat 'ping -n 16 127.0.0.1 > nul'
                echo "Application deployed to staging on port 3000"
            }
        }

        stage('Release') {
            steps {
                echo "Promoting to production release..."
                bat 'docker tag %IMAGE_NAME%:latest %IMAGE_NAME%:prod-%IMAGE_TAG%'
                echo "Released as prod-%IMAGE_TAG%"
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