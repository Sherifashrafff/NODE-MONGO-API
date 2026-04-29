pipeline{
    agent any
    stages{
        stage('Install Depns'){
            agent{
                docker{
                    image 'node:18.0.0'
                    reuseNode true
                }
            }
            steps{
                sh '''
                node --version
                npm --version
                npm ci
                '''
            }
        }
        stage('Lint Test'){
            agent{
                docker{
                    image 'node:18.0.0'
                    reuseNode true
                }
            }
            steps{
                sh '''
                npm run lint
                '''
            }
        }
        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit -- --coverage'
            }
            post {
                always {
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
    }
}