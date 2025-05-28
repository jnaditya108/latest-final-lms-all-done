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
                    bat 'docker-compose build'
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    // Stop any running containers
                    bat 'docker-compose down || exit 0'
                    
                    // Start the application
                    bat 'docker-compose up -d'
                    
                    // Wait for services to be ready
                    
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    // Check if containers are running
                    bat 'docker ps | findstr lms'
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
