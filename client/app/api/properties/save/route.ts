import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { propertyId } = await request.json()
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const existingSave = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId: propertyId
        }
      }
    })

    if (existingSave) {
      // Unsave the property
      await prisma.savedProperty.delete({
        where: {
          userId_propertyId: {
            userId: session.user.id,
            propertyId: propertyId
          }
        }
      })

      return NextResponse.json({ 
        message: 'Property unsaved successfully',
        isSaved: false 
      })
    } else {
      // Save the property
      await prisma.savedProperty.create({
        data: {
          userId: session.user.id,
          propertyId: propertyId
        }
      })

      return NextResponse.json({ 
        message: 'Property saved successfully',
        isSaved: true 
      })
    }
  } catch (error) {
    console.error('Error saving/unsaving property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Check if property is saved by this user
    const savedProperty = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId: propertyId
        }
      }
    })

    return NextResponse.json({ 
      isSaved: !!savedProperty 
    })
  } catch (error) {
    console.error('Error checking property save status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

