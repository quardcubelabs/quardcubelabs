import { getProjects } from '../lib/projects-actions'
import type { Project } from '../types/database'

async function testProjects() {
  console.log('Testing projects database connection...')
  
  try {
    const result = await getProjects()
    
    if (result.error) {
      console.error('Error:', result.error)
    } else {
      console.log('Success! Found', result.data?.length || 0, 'projects')
      result.data?.forEach((project: Project, index: number) => {
        console.log(`${index + 1}. ${project.title} (${project.category})`)
      })
    }
  } catch (error) {
    console.error('Exception:', error)
  }
}

testProjects()
