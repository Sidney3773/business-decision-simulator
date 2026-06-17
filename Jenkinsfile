pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        NODE_ENV   = 'test'
        JWT_SECRET = 'test_secret_jenkins'
        JWT_EXPIRE = '7d'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Test Backend (Jest)') {
            steps {
                dir('backend') {
                    bat 'npm test -- --ci'
                }
            }
        }

        stage('Test Frontend (Vitest)') {
            steps {
                dir('frontend') {
                    bat 'npx vitest run'
                }
            }
        }
    }

    post {
        success {
            echo 'Todos los tests pasaron correctamente.'
        }
        failure {
            echo 'Pipeline fallido. Revisar logs de tests.'
        }
    }
}