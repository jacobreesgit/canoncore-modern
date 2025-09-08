#!/usr/bin/env tsx

import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { DeletionService } from './lib/deletion-service.js'
import { AppError, ErrorHandler } from './lib/error-handling.js'

const program = new Command()
const deletionService = new DeletionService()
const errorHandler = new ErrorHandler()

program
  .name('db-cleanup')
  .description('Safely delete entities from the CanonCore database')
  .version('1.0.0')

program
  .command('delete')
  .description('Delete specific entities from the database')
  .argument('<type>', 'Entity type: users, universes, collections, groups, content')
  .argument('<id>', 'Entity ID to delete')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--dry-run', 'Show what would be deleted without executing')
  .action(async (type: string, id: string, options) => {
    try {
      const validTypes = ['users', 'universes', 'collections', 'groups', 'content']
      
      if (!validTypes.includes(type)) {
        throw new AppError(
          `Invalid entity type "${type}". Valid types: ${validTypes.join(', ')}`,
          true
        )
      }

      // Validate ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        throw new AppError('Invalid ID format. Expected UUID format.', true)
      }

      console.log(chalk.blue(`🔍 Analyzing ${type} with ID: ${id}`))

      // Get deletion preview
      const preview = await deletionService.getDeletePreview(type, id)
      
      if (preview.length === 0) {
        console.log(chalk.yellow(`⚠️  No entity found with ID: ${id}`))
        return
      }

      console.log(chalk.yellow('\n📋 The following entities will be deleted:'))
      preview.forEach(item => {
        console.log(`  ${chalk.red('✗')} ${item.type}: ${item.name} (${item.id})`)
      })
      console.log(`\n${chalk.bold(`Total: ${preview.length} entities`)}`)

      if (options.dryRun) {
        console.log(chalk.blue('\n🔍 Dry run complete. No changes made.'))
        return
      }

      // Confirmation prompt
      if (!options.yes) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('Are you sure you want to delete these entities? This action cannot be undone.'),
            default: false
          }
        ])

        if (!confirmed) {
          console.log(chalk.blue('🚫 Operation cancelled.'))
          return
        }
      }

      console.log(chalk.blue('\n🗑️  Starting deletion process...'))
      
      const result = await deletionService.deleteEntity(type, id)
      
      if (result.success) {
        console.log(chalk.green(`✅ Successfully deleted ${result.deletedCount || 0} entities`))
      } else {
        throw new AppError(result.error || 'Unknown deletion error', true)
      }

    } catch (error) {
      await errorHandler.handleError(error as Error)
      process.exit(1)
    }
  })

program
  .command('delete-user-data')
  .description('Delete all data for a specific user')
  .argument('<userId>', 'User ID whose data should be deleted')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--dry-run', 'Show what would be deleted without executing')
  .action(async (userId: string, options) => {
    try {
      // Validate ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        throw new AppError('Invalid user ID format. Expected UUID format.', true)
      }

      console.log(chalk.blue(`🔍 Analyzing all data for user: ${userId}`))

      // Get deletion preview for all user data
      const preview = await deletionService.getUserDataPreview(userId)
      
      if (preview.length === 0) {
        console.log(chalk.yellow(`⚠️  No data found for user: ${userId}`))
        return
      }

      console.log(chalk.yellow('\n📋 The following entities will be deleted:'))
      
      // Group by entity type for clearer display
      const grouped = preview.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = []
        acc[item.type].push(item)
        return acc
      }, {} as Record<string, typeof preview>)

      Object.entries(grouped).forEach(([type, items]) => {
        console.log(`  ${chalk.cyan(type.toUpperCase())} (${items.length}):`)
        items.forEach(item => {
          console.log(`    ${chalk.red('✗')} ${item.name} (${item.id})`)
        })
      })
      
      console.log(`\n${chalk.bold(`Total: ${preview.length} entities`)}`)

      if (options.dryRun) {
        console.log(chalk.blue('\n🔍 Dry run complete. No changes made.'))
        return
      }

      // Extra confirmation for user data deletion
      if (!options.yes) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('⚠️  DELETE ALL USER DATA? This will remove the user account and ALL associated content. This action cannot be undone.'),
            default: false
          }
        ])

        if (!confirmed) {
          console.log(chalk.blue('🚫 Operation cancelled.'))
          return
        }
      }

      console.log(chalk.blue('\n🗑️  Starting user data deletion process...'))
      
      const result = await deletionService.deleteUserData(userId)
      
      if (result.success) {
        console.log(chalk.green(`✅ Successfully deleted user and ${result.deletedCount || 0} associated entities`))
      } else {
        throw new AppError(result.error || 'Unknown deletion error', true)
      }

    } catch (error) {
      await errorHandler.handleError(error as Error)
      process.exit(1)
    }
  })

// Global error handlers
process.on('uncaughtException', async (error: Error) => {
  await errorHandler.handleError(error)
  if (!errorHandler.isTrustedError(error)) {
    process.exit(1)
  }
})

process.on('unhandledRejection', async (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  await errorHandler.handleError(error)
  if (!errorHandler.isTrustedError(error)) {
    process.exit(1)
  }
})

program.parse()