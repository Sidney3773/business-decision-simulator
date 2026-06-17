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
                    sh 'npm ci'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Test Backend (Jest)') {
            steps {
                dir('backend') {
                    sh 'npm test -- --ci'
                }
            }
        }

        stage('Test Frontend (Vitest)') {
            steps {
                dir('frontend') {
                    sh 'npx vitest run'
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
