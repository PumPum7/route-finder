import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { jsPDF } from "jspdf"
import type { Location, RouteInstructions } from "./api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} minutes`
}

export function generateRoutePDF(
  locations: Location[], 
  instructions: RouteInstructions
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Route Instructions', pageWidth / 2, y, { align: 'center' })
  y += 20

  // Summary box
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'FD')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  y += 10
  doc.text(`Total Distance: ${formatDistance(instructions.distance)}`, margin + 10, y)
  y += 7
  doc.text(`Estimated Time: ${formatDuration(instructions.duration)}`, margin + 10, y)
  y += 20

  // Stops section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Stops', margin, y)
  y += 10
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  locations.forEach((location, index) => {
    if (y > 270) {
      doc.addPage()
      y = margin
    }
    doc.text(`${index + 1}. ${location.address}`, margin, y)
    y += 7
  })

  y += 10

  // Turn-by-turn section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Turn-by-turn Instructions', margin, y)
  y += 10

  instructions.steps.forEach((step, index) => {
    if (y > 270) {
      doc.addPage()
      y = margin
    }
    
    // Main instruction
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    // Handle long instructions by wrapping text
    const splitText = doc.splitTextToSize(
      `${index + 1}. ${step.instruction}`, 
      pageWidth - 2 * margin
    )
    doc.text(splitText, margin, y)
    y += splitText.length * 7
    
    // Distance and duration on next line
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(
      `${formatDistance(step.distance)} - ${formatDuration(step.duration)}`,
      margin + 10,
      y
    )
    doc.setTextColor(0)
    y += 10
  })

  // Save the PDF
  doc.save('route-instructions.pdf')
}
