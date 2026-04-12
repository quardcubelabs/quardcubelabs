import { getProjects } from '../lib/projects-actions'
import type { Project } from '../types/database'

async function testProjects() {
  
  try {
    const result = await getProjects()
    
    if (result.error) {
      console.error('Error:', result.error)
    } else {
      result.data?.forEach((project: Project, index: number) => {
      })
    }
  } catch (error) {
    console.error('Exception:', error)
  }
}

testProjects()
