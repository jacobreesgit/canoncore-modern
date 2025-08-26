import { db } from '../db'
import {
  users,
  universes,
  content,
  userProgress,
  favorites,
  contentRelationships,
} from '../db/schema'

async function clearAllData() {
  try {
    console.log('🗑️  Clearing all data from database...')

    // Delete in order to respect foreign key constraints
    console.log('Deleting content relationships...')
    await db.delete(contentRelationships)

    console.log('Deleting user progress...')
    await db.delete(userProgress)

    console.log('Deleting favorites...')
    await db.delete(favorites)

    console.log('Deleting content...')
    await db.delete(content)

    console.log('Deleting universes...')
    await db.delete(universes)

    console.log('Deleting users...')
    await db.delete(users)

    console.log('✅ All data cleared successfully!')
    console.log('Database is now empty and ready for fresh development.')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error clearing database:', error)
    }
    throw error
  }
}

// Run the clear operation
clearAllData()
  .then(() => {
    console.log('🎉 Database cleared successfully!')
    process.exit(0)
  })
  .catch(error => {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Failed to clear database:', error)
    }
    process.exit(1)
  })
