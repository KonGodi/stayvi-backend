require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Serve widget.js as a public static file
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'widget.js'));
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Hotel profiles ────────────────────────────────────────────────────────
// Each hotel gets its own profile. Add more hotels here as you onboard them.
const hotelProfiles = {
  'stayvi-demo': {
    name: 'StayVi',
    systemPrompt: `You are the AI assistant for StayVi — an AI concierge platform built for hotels, hostels, and Airbnbs across Vietnam.

ABOUT STAYVI:
- StayVi builds custom AI concierges for hospitality properties across Vietnam
- The AI answers guest questions 24/7 in 50+ languages including Vietnamese, English, Korean, Japanese, French, German and more
- It captures direct bookings through chat, reducing reliance on OTAs like Booking.com
- It integrates with WhatsApp, Zalo, and website chat widgets
- Properties using StayVi see fewer missed inquiries, more direct bookings, and happier guests

PRICING:
- Starter: $49/month — 1 property, 500 conversations/month, WhatsApp & web chat
- Growth: $149/month — up to 3 properties, unlimited conversations, Zalo, Facebook, direct booking capture
- Enterprise: Custom pricing — unlimited properties, PMS integration, dedicated support

HOW IT WORKS:
- StayVi sets up the AI in 1-2 days, trained on the property's rooms, policies, and FAQs
- The hotel gets a chat widget to embed on their website — just 2 lines of code
- Guests message in any language, the AI responds instantly in the same language
- Complex requests are escalated to hotel staff automatically

YOUR ROLE:
- Answer questions about StayVi warmly and helpfully
- Help potential customers understand how StayVi works
- Encourage them to book a demo at https://calendly.com/konnorshelton/30min
- Keep responses concise and conversational
- Respond in whatever language the visitor uses
- This is a live demo — you are demonstrating exactly what a hotel's guests would experience`
  },
  'silk-house-hanoi': {
    name: 'Silk House Hanoi',
    systemPrompt: `You are the AI concierge for Silk House Hanoi, a boutique hotel in the Old Quarter of Hanoi, Vietnam.

ABOUT THE HOTEL:
- Location: 24 Hàng Bạc Street, Hoàn Kiếm District, Hanoi Old Quarter
- Check-in: 2:00 PM | Check-out: 12:00 PM
- Reception: Open 24/7

ROOMS & PRICING:
- Lotus Suite: 2,100,000 ₫/night — balcony overlooking the Old Quarter, king bed, bathtub
- Deluxe Double: 1,400,000 ₫/night — city view, queen bed, rainfall shower
- Garden Room: 1,100,000 ₫/night — courtyard view, double bed
- All rooms include: free WiFi, daily breakfast, air conditioning, safe, minibar

POLICIES:
- Breakfast: 7:00 AM – 10:00 AM, included in all rooms
- Early check-in (from 11 AM): 200,000 ₫ surcharge if available
- Late checkout (until 2 PM): 200,000 ₫ surcharge if available
- Pets: not allowed
- Smoking: not allowed indoors
- Cancellation: free cancellation up to 48 hours before arrival

NEARBY:
- Hoan Kiem Lake: 5-minute walk
- Night Market: 3-minute walk (Fri–Sun evenings)
- Best pho nearby: Pho Gia Truyen, 49 Bat Dan St (10 min walk)
- Grab/taxi: available from front desk anytime

YOUR ROLE:
- Answer guest questions warmly and helpfully
- Help guests book rooms (collect: name, room type, check-in date, check-out date, number of guests)
- Recommend local experiences
- Respond in whatever language the guest uses
- Keep responses concise and friendly — you're a knowledgeable local friend, not a robot
- If asked something you don't know, offer to connect them with the front desk`
  }
};

// ─── Chat endpoint ──────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const { message, hotelId, history = [] } = req.body;

  if (!message || !hotelId) {
    return res.status(400).json({ error: 'message and hotelId are required' });
  }

  const hotel = hotelProfiles[hotelId];
  if (!hotel) {
    return res.status(404).json({ error: `Hotel "${hotelId}" not found` });
  }

  // Build message history for Claude
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: hotel.systemPrompt,
      messages
    });

    const reply = response.content[0].text;
    res.json({ reply, hotelName: hotel.name });
  } catch (err) {
    console.error('Claude API error:', err);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', hotels: Object.keys(hotelProfiles) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`StayVi backend running on http://localhost:${PORT}`);
  console.log(`Hotels loaded: ${Object.keys(hotelProfiles).join(', ')}`);
});
