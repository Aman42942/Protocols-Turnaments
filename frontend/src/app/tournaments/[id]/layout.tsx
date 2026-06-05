import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const domain = process.env.NEXT_PUBLIC_APP_URL || "https://protocols-turnaments.vercel.app";
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/tournaments/${id}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) throw 'API returned non-200 status (Tournament not found)';

    const tournament = await res.json();
    
    const currencyText = tournament.currency === 'INR' ? '₹' : 'Coins';
    
    const title = `${tournament.title.toUpperCase()} | Protocol Tournament`;
    const description = `🎮 Game: ${tournament.game} • 🎟️ Entry: ${currencyText} ${tournament.entryFeePerPerson} • 💰 Prize Pool: ${currencyText} ${tournament.prizePool.toLocaleString('en-IN')}. Join the battle on Protocol and win prizes!`;
    
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
        url: `${domain}/tournaments/${id}`,
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
    };
  } catch (error) {
    // console.log('Tournament metadata fetch (404/Silent):', error);
    return {
      title: 'Tournament Details | Protocol',
      description: 'Join this tournament on Protocol esports platform.',
    };
  }
}

export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
