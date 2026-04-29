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
    }
}