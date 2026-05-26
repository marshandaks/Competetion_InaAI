import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing tables
  await prisma.feedback.deleteMany();
  await prisma.aiInsight.deleteMany();

  // Create initial feedback entries
  const feedbacks = [
    {
      customerName: 'Ahmad Faisal',
      rating: 5,
      feedback: 'Aplikasi ini sangat luar biasa! Transaksi cepat, UI sangat halus mirip Vercel dashboard. CS ramah sekali.',
      createdAt: new Date('2026-05-24T10:00:00Z'),
      sentiment: 'positive',
      confidenceScore: 0.98,
      topics: ['app bug', 'customer service'],
      summary: 'Sangat puas dengan UI aplikasi dan respon CS yang ramah.',
      version: 1,
    },
    {
      customerName: 'Siti Rahma',
      rating: 2,
      feedback: 'Sangat kecewa dengan layanan kurir. Paket penyok dan pengirimannya telat 4 hari!',
      createdAt: new Date('2026-05-24T11:30:00Z'),
      sentiment: 'negative',
      confidenceScore: 0.94,
      topics: ['delivery', 'packaging'],
      summary: 'Komplain pengiriman kurir telat dan kemasan rusak.',
      version: 1,
    },
    {
      customerName: 'Kevin Wijaya',
      rating: 4,
      feedback: 'Kualitas barang bagus sesuai ekspektasi. Pengemasan bubble wrap tebal sekali. Sukses terus!',
      createdAt: new Date('2026-05-24T14:15:00Z'),
      sentiment: 'positive',
      confidenceScore: 0.96,
      topics: ['packaging'],
      summary: 'Senang dengan pengemasan barang tebal dan kualitas produk.',
      version: 1,
    },
    {
      customerName: 'Rina Melati',
      rating: 1,
      feedback: 'Kenapa aplikasi crash terus pas saya mau checkout belanjaan ya? Tolong developer dibetulkan bugnya!',
      createdAt: new Date('2026-05-25T08:00:00Z'),
      sentiment: 'negative',
      confidenceScore: 0.99,
      topics: ['app bug'],
      summary: 'Komplain aplikasi selalu crash saat proses checkout belanja.',
      version: 1,
    },
    {
      customerName: 'Bambang Tri',
      rating: 3,
      feedback: 'Harganya standard aja sih dibanding e-commerce sebelah. Pengiriman lumayan cepet.',
      createdAt: new Date('2026-05-25T09:45:00Z'),
      sentiment: 'neutral',
      confidenceScore: 0.85,
      topics: ['pricing', 'delivery'],
      summary: 'Menilai harga standard dan kecepatan pengiriman lumayan.',
      version: 1,
    },
  ];

  for (const f of feedbacks) {
    await prisma.feedback.create({ data: f });
  }

  // Create initial AI Insights
  const insights = [
    {
      title: 'Spike in App Crashes',
      content: 'App crash complaints spiked by 25% today during checkout operations. Investigate high-concurrency payment gateway routing.',
      type: 'warning',
    },
    {
      title: 'Excellent Packaging Feedback',
      content: 'Customer satisfaction with packaging is at an all-time high of 98%. Safe double-layered bubble wrap strategy is highly successful.',
      type: 'success',
    },
    {
      title: 'Delivery Speed Bottleneck',
      content: 'Average shipping duration has increased by 1.8 days in the last week due to local courier constraints.',
      type: 'trend',
    },
  ];

  for (const i of insights) {
    await prisma.aiInsight.create({ data: i });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
