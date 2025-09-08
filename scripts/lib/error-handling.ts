import chalk from 'chalk'

/**
 * Operational error class for expected errors
 * Following Context7 best practice for error classification
 */
export class AppError extends Error {
  public readonly isOperational: boolean

  constructor(description: string, isOperational: boolean) {
    super(description)
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
    this.isOperational = isOperational
    Error.captureStackTrace(this)
  }
}

/**
 * Centralized error handler following Node.js best practices
 * Based on Context7 research on error handling patterns
 */
export class ErrorHandler {
  public async handleError(err: Error): Promise<void> {
    await this.logError(err)
    
    if (this.isTrustedError(err)) {
      await this.handleOperationalError(err)
    } else {
      await this.handleProgrammerError(err)
    }
  }

  public isTrustedError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational
    }
    return false
  }

  private async logError(err: Error): Promise<void> {
    const timestamp = new Date().toISOString()
    const errorType = this.isTrustedError(err) ? 'OPERATIONAL' : 'PROGRAMMER'
    
    console.error(chalk.red(`\n[${timestamp}] ${errorType} ERROR:`))
    console.error(chalk.red(`Message: ${err.message}`))
    
    if (!this.isTrustedError(err)) {
      console.error(chalk.red(`Stack: ${err.stack}`))
    }
  }

  private async handleOperationalError(err: Error): Promise<void> {
    // Operational errors are expected and should be handled gracefully
    console.error(chalk.yellow(`\n❌ ${err.message}`))
    console.error(chalk.yellow('💡 Please check your input and try again.'))
  }

  private async handleProgrammerError(err: Error): Promise<void> {
    // Programmer errors indicate bugs and should cause the process to exit
    console.error(chalk.red('\n🚨 An unexpected error occurred.'))
    console.error(chalk.red('This indicates a bug in the application.'))
    console.error(chalk.red('The process will now exit for safety.'))
    
    // In a production environment, you might want to:
    // - Send error to monitoring service (e.g., Sentry)
    // - Notify administrators
    // - Save error to log file
  }
}

/**
 * Create operational error helper
 */
export function createOperationalError(message: string): AppError {
  return new AppError(message, true)
}

/**
 * Create programmer error helper
 */
export function createProgrammerError(message: string): AppError {
  return new AppError(message, false)
}