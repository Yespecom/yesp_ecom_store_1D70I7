import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message, category } = await req.json()

    // Validate input (basic validation)
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 })
    }

    // Create a Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address from environment variables
        pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail App Password from environment variables
      },
    })

    // Email content for the recipient (oneofwun.in@gmail.com)
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender's email (your Gmail)
      to: "oneofwun.in@gmail.com", // Recipient's email
      subject: `Contact Form Submission: ${subject} (Category: ${category})`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    }

    // Send the email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: "Email sent successfully!" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    // Provide a more generic error message to the client for security
    return NextResponse.json({ message: "Failed to send message. Please try again later." }, { status: 500 })
  }
}
