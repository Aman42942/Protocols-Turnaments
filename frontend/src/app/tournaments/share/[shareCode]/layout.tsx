import type { Metadata } from 'next';

interface Props {
  params: Promise<{ shareCode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareCode } = await params;
  const domain = process.env.NEXT_PUBLIC_APP_URL || "https://protocols-turnaments.vercel.app";
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/tournaments/share/${shareCode}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error('Tournament share link not found');

    const tournament = await res.json();
    
    const currencyText = tournament.currency === 'INR' ? '₹' : 'Coins';
    
    const title = `${tournament.title.toUpperCase()} | Join Tournament`;
    const description = `🎮 Game: ${tournament.game} • 🎟️ Entry: ${currencyText} ${tournament.entryFeePerPerson} • 💰 Prize Pool: ${currencyText} ${tournament.prizePool.toLocaleString('en-IN')}. Join the ultimate esports battle on Protocol!`;
    
    let ogImage = tournament.banner || `${domain}/banners/landscape_esports.png`;
    if (!ogImage.startsWith('http')) {
      const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
      const cleanPath = ogImage.startsWith('/') ? ogImage : `/${ogImage}`;
      ogImage = `${cleanDomain}${cleanPath}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${domain}/tournaments/share/${shareCode}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: tournament.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      robots: {
        index: true,
        follow: true,
      }
    };
  } catch (error) {
    console.error('Error generating share metadata:', error);
    return {
      title: 'Invite to Join Tournament | Protocol',
      description: 'Join the ultimate esports platform. Compete, win, and build your legacy.',
    };
  }
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
