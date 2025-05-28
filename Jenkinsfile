pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                script {
                    sh 'docker-compose build'
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    // Stop any running containers
                    sh 'docker-compose down || true'
                    
                    // Start the application
                    sh 'docker-compose up -d'
                    
                    // Wait for services to be ready
                    sh 'sleep 30'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    // Check if containers are running
                    sh 'docker ps | grep lms'
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! Application is running.'
        }
        failure {
            echo 'Deployment failed! Check the logs for details.'
        }
    }
} 