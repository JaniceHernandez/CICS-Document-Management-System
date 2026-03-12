import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, GraduationCap, FileText, Search, Clock, Download } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'cics-hero');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white">
        <Link className="flex items-center justify-center" href="/">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-2">
            <FileText className="text-white h-5 w-5" />
          </div>
          <span className="text-sm md:text-base font-headline font-bold text-primary truncate max-w-[200px] md:max-w-none">
            COLLEGE OF INFORMATICS AND COMPUTING STUDIES DOCUMENT MANAGEMENT SYSTEM
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="/login">
            Login
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-6xl/none uppercase leading-tight">
                    COLLEGE OF INFORMATICS AND COMPUTING STUDIES DOCUMENT MANAGEMENT SYSTEM
                  </h1>
                  <p className="max-w-[600px] text-zinc-200 md:text-xl font-body">
                    Access official institutional documents, academic resources, and announcements securely.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="bg-secondary text-primary hover:bg-secondary/90 font-bold px-8 rounded-full">
                      Access Portal
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {heroImage && (
                  <Image
                    alt="University Resource Center"
                    className="aspect-video overflow-hidden rounded-xl object-cover object-center shadow-2xl"
                    height={310}
                    src={heroImage.imageUrl}
                    width={550}
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl text-primary uppercase">Institutional Knowledge Hub</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Streamlining document access and administrative workflows for the CICS community.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              <Card className="border-none shadow-md bg-white hover:translate-y-[-4px] transition-transform">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">Institutional Access</h3>
                  <p className="text-muted-foreground">Secure sign-in via NEU Google accounts. Restricted access ensures document integrity.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white hover:translate-y-[-4px] transition-transform">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">Filtered Library</h3>
                  <p className="text-muted-foreground">Find documents specifically targeted at your academic program or global requirements.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white hover:translate-y-[-4px] transition-transform">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">Contribution Portal</h3>
                  <p className="text-muted-foreground">Students can contribute resources to the library for administrative review and publication.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t bg-white">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © 2024 COLLEGE OF INFORMATICS AND COMPUTING STUDIES. ALL RIGHTS RESERVED.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Institutional Policies
            </Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
