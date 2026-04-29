pipeline {
    agent any

    environment {
        NODE_ENV      = 'test'
        JWT_SECRET    = credentials('JWT_SECRET')   // set this secret in Jenkins credential store
        REPORTS_DIR   = 'reports'
        COVERAGE_DIR  = 'coverage'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        // ─── 1. SOURCE ────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        // ─── 2. DEPENDENCIES ─────────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                sh '''
                    node --version
                    npm --version
                    npm ci --prefer-offline
                '''
            }
        }

        // ─── 3. LINT ──────────────────────────────────────────────────────────
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        // ─── 4. UNIT TESTS ───────────────────────────────────────────────────
        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit -- --coverage'
            }
            post {
                always {
                    junit testResults: 'reports/unit-junit.xml', allowEmptyResults: false
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Unit Test Coverage'
                    ])
                }
            }
        }

        // ─── 5. INTEGRATION TESTS ────────────────────────────────────────────
        stage('Integration Tests') {
            steps {
                // mongodb-memory-server spins up its own mongod; no external DB needed
                sh 'npm run test:integration'
            }
            post {
                always {
                    junit testResults: 'reports/integration-junit.xml', allowEmptyResults: false
                }
            }
        }

        // ─── 6. SECURITY — npm audit ─────────────────────────────────────────
        stage('Security: npm audit') {
            steps {
                script {
                    // Capture JSON report for archiving regardless of exit code
                    sh 'npm audit --json > reports/npm-audit.json 2>&1 || true'
                    archiveArtifacts artifacts: 'reports/npm-audit.json', allowEmptyArchive: true

                    // Now fail the build if HIGH or CRITICAL vulns exist
                    def auditExit = sh(
                        script: 'npm audit --audit-level=high',
                        returnStatus: true
                    )
                    if (auditExit != 0) {
                        error('npm audit found HIGH/CRITICAL vulnerabilities — failing build')
                    }
                }
            }
        }

        // ─── 7. SECURITY — Gitleaks (secret scanning) ────────────────────────
        stage('Security: Gitleaks') {
            steps {
                script {
                    def available = sh(script: 'which gitleaks', returnStatus: true)
                    if (available == 0) {
                        def leakExit = sh(
                            script: 'gitleaks detect --source=. --report-format=json --report-path=reports/gitleaks.json --exit-code=1',
                            returnStatus: true
                        )
                        archiveArtifacts artifacts: 'reports/gitleaks.json', allowEmptyArchive: true
                        if (leakExit != 0) {
                            error('Gitleaks detected secrets in the repository — failing build')
                        }
                    } else {
                        echo 'WARNING: gitleaks binary not found. Install it on the Jenkins agent to enable secret scanning.'
                        unstable('Gitleaks not installed')
                    }
                }
            }
        }

        // ─── 8. SECURITY — Semgrep (SAST) ────────────────────────────────────
        stage('Security: Semgrep') {
            steps {
                script {
                    def available = sh(script: 'which semgrep', returnStatus: true)
                    if (available == 0) {
                        def semgrepExit = sh(
                            script: '''
                                semgrep \
                                  --config=p/nodejs \
                                  --config=p/owasp-top-ten \
                                  --json \
                                  --output=reports/semgrep.json \
                                  --error \
                                  src/
                            ''',
                            returnStatus: true
                        )
                        archiveArtifacts artifacts: 'reports/semgrep.json', allowEmptyArchive: true
                        if (semgrepExit != 0) {
                            error('Semgrep found issues with severity >= ERROR — failing build')
                        }
                    } else {
                        echo 'WARNING: semgrep binary not found. Install it on the Jenkins agent to enable SAST.'
                        unstable('Semgrep not installed')
                    }
                }
            }
        }
    }

    // ─── POST ─────────────────────────────────────────────────────────────────
    post {
        success {
            echo "✓ Pipeline passed — ${env.JOB_NAME} #${env.BUILD_NUMBER} on branch ${env.GIT_BRANCH}"
        }

        failure {
            echo "✗ Pipeline FAILED — ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            // Optional email notification — requires Jenkins Email Extension plugin
            // Configure SMTP in Jenkins > Manage Jenkins > Configure System
            mail(
                to: 'team@example.com',
                subject: "[FAILED] ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
Build FAILED.

Job:    ${env.JOB_NAME}
Build:  #${env.BUILD_NUMBER}
Branch: ${env.GIT_BRANCH}
URL:    ${env.BUILD_URL}

Check the console output for details.
                """.stripIndent()
            )
        }

        unstable {
            echo "⚠ Pipeline UNSTABLE — some security scanners were skipped"
        }

        always {
            // Archive all reports before workspace cleanup
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
            cleanWs()
        }
    }
}
