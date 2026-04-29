pipeline{
    agent any
    stages{
        stage('Install Deps'){
            agent{
<<<<<<< HEAD
<<<<<<< HEAD
                docker{
                image 'node:18.0.0'
=======
                docker
                {image 'node:18.0.0'
>>>>>>> 1afbfaf (edit jenkinsfile)
                reuseNode true}
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