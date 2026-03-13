import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const domain = "https://protocols-turnaments.vercel.app";
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/tournaments/${id}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error('Tournament not found');

    const tournament = await res.json();
    
    const currencySymbol = tournament.currency === 'INR' ? '₹' : tournament.currency === 'COIN' ? '🪙' : tournament.currency;
    
    const title = `🏆 ${tournament.title.toUpperCase()} | Protocol Tournament`;
    const description = `🎮 Game: ${tournament.game} | 💰 Entry: ${currencySymbol}${tournament.entryFeePerPerson} | 🏆 Prize: ${currencySymbol}${tournament.prizePool.toLocaleString('en-IN')}\n\nJoin the battle on Protocol! Compete with the best and win daily prizes.`;
    
    let ogImage = tournament.banner || `${domain}/banners/landscape_esports.png`;
    if (ogImage.startsWith('/')) {
      ogImage = `${domain}${ogImage}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
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
    console.error('Error generating tournament metadata:', error);
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
