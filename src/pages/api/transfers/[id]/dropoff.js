import prisma from '../../../../lib/prisma'
import { getUser } from '../../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only transporters can confirm dropoff
    if (user.role !== 'TRANSPORTER') {
      return res.status(403).json({ error: 'Only transporters can confirm dropoff' })
    }

    const { id } = req.query

    // Get the transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id }
    })

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' })
    }

    // Only assigned transporter can confirm dropoff
    if (transfer.transporterId !== user.id) {
      return res.status(403).json({ error: 'You are not assigned to this transfer' })
    }

    // Check if already dropped off
    if (transfer.dropoffTime) {
      return res.status(400).json({ error: 'Dropoff already confirmed' })
    }

    // Update dropoff time
    const updatedTransfer = await prisma.transfer.update({
      where: { id },
      data: { dropoffTime: new Date() },
      include: {
        batch: true,
        fromOwner: {
          select: { farmtraceId: true, name: true, role: true }
        },
        toOwner: {
          select: { farmtraceId: true, name: true, role: true }
        }
      }
    })

    res.status(200).json({ success: true, transfer: updatedTransfer })
  } catch (error) {
    console.error('Dropoff error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
