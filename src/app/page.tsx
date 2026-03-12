import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, GraduationCap, FileText, Search, UserCircle, ShieldAlert } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'cics-hero');
  const logoImage = PlaceHolderImages.find(img => img.id === 'cics-logo');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-20 flex items-center border-b bg-white sticky top-0 z-50 shadow-sm">
        <Link className="flex items-center justify-center gap-3" href="/">
          {logoImage && (
            <Image 
              src={logoImage.imageUrl} 
              alt="NEU Logo" 
              width={48} 
              height={48} 
              className="object-contain"
            />
          )}
          <span className="text-xs md:text-sm font-headline font-bold text-primary max-w-[280px] md:max-w-none leading-tight uppercase">
            COLLEGE OF INFORMATICS AND COMPUTING STUDIES DOCUMENT MANAGEMENT SYSTEM
          </span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
          <Link href="/login?role=student">
            <Button variant="ghost" className="text-sm font-bold text-primary hover:text-primary hover:bg-primary/5">
              <UserCircle className="h-4 w-4 mr-2" />
              Student Login
            </Button>
          </Link>
          <Link href="/login?role=admin">
            <Button variant="outline" className="text-sm font-bold border-primary text-primary hover:bg-primary hover:text-white">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Admin Access
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-primary text-white overflow-hidden relative">
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_500px] lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full bg-secondary/20 px-4 py-1.5 text-sm font-bold text-secondary border border-secondary/30">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Official Institutional Repository
                  </div>
                  <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-6xl/none uppercase leading-tight">
                    COLLEGE OF INFORMATICS AND COMPUTING STUDIES DOCUMENT MANAGEMENT SYSTEM
                  </h1>
                  <p className="max-w-[600px] text-zinc-200 md:text-xl font-body leading-relaxed">
                    Secure institutional access to curriculum documents, academic resources, and official university announcements.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row pt-4">
                  <Link href="/login?role=student">
                    <Button size="lg" className="w-full sm:w-auto bg-secondary text-primary hover:bg-secondary/90 font-bold px-12 h-14 rounded-full shadow-2xl shadow-secondary/20 text-lg transition-transform hover:scale-105">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center relative">
                <div className="absolute inset-0 bg-secondary/10 blur-3xl rounded-full" />
                {heroImage && (
                  <Image
                    alt="University Resource Center"
                    className="aspect-video overflow-hidden rounded-3xl object-cover object-center shadow-2xl relative z-10 border-4 border-white/10"
                    height={400}
                    src={heroImage.imageUrl}
                    width={700}
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 transform origin-top" />
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-zinc-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl text-primary uppercase">Institutional Knowledge Hub</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Streamlining document access and administrative workflows for the CICS community.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl items-center gap-8 py-4 lg:grid-cols-3">
              <Card className="border-none shadow-xl bg-white rounded-3xl p-4 hover:translate-y-[-8px] transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="p-5 bg-blue-50 rounded-3xl text-blue-600">
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-primary">Secure Access</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Restricted sign-in using NEU institutional Google accounts (@neu.edu.ph) ensures the security of academic assets.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-white rounded-3xl p-4 hover:translate-y-[-8px] transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="p-5 bg-secondary/10 rounded-3xl text-secondary">
                    <Search className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-primary">Library Discovery</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Easily locate documents targeted at your specific academic program or browse global institutional requirements.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-xl bg-white rounded-3xl p-4 hover:translate-y-[-8px] transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="p-5 bg-green-50 rounded-3xl text-green-600">
                    <FileText className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-primary">Digital Submissions</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    Students can contribute academic resources for administrative review, fostering a collaborative learning environment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-4">
              {logoImage && (
                <Image 
                  src={logoImage.imageUrl} 
                  alt="NEU Logo" 
                  width={60} 
                  height={60} 
                  className="grayscale opacity-50"
                />
              )}
              <div>
                <p className="text-sm font-bold text-primary uppercase leading-tight">
                  COLLEGE OF INFORMATICS AND COMPUTING STUDIES
                </p>
                <p className="text-xs text-muted-foreground font-medium">New Era University • Quezon City, Philippines</p>
              </div>
            </div>
            <nav className="flex gap-8">
              <Link className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors" href="#">
                POLICIES
              </Link>
              <Link className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors" href="#">
                PRIVACY
              </Link>
              <Link className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors" href="#">
                CONTACT
              </Link>
            </nav>
          </div>
          <p className="text-[10px] text-muted-foreground text-center border-t pt-8 font-bold uppercase tracking-widest">
            © 2024 NEW ERA UNIVERSITY - CICS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
