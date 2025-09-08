import { db } from './lib/db-cli.js'
import { users } from '@/lib/db/schema'

async function getUserId() {
  try {
    const allUsers = await db.select({ 
      id: users.id, 
      name: users.name, 
      email: users.email 
    }).from(users)
    
    console.log('Users in database:')
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}`)
      console.log(`  Name: ${user.name || 'N/A'}`)
      console.log(`  Email: ${user.email}`)
      console.log()
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

getUserId()