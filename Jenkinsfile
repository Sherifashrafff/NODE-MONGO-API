pipeline{
    agent any
    stages{
/*        stage('Install Depns'){
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
        }*/
        stage('Lint Tests'){
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
                    junit testResults: 'reports/unit-junit.xml', allowEmptyResults: false
                }
            }
        }
    }
}