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
          <span className="text-xl font-headline font-bold text-primary">CICS DOCUMENT MANAGEMENT SYSTEM</span>
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
                  <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    COLLEGE OF INFORMATICS AND COMPUTING STUDIES DOCUMENT MANAGEMENT SYSTEM
                  </h1>
                  <p className="max-w-[600px] text-zinc-200 md:text-xl font-body">
                    Access official university documents, policies, and resources securely. Powered by NEU Google authentication.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="bg-secondary text-primary hover:bg-secondary/90 font-bold px-8 rounded-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {heroImage && (
                  <Image
                    alt="University Campus"
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
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl text-primary">Everything you need in one place</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  The official CICS Document Management Hub streamlines how students and faculty interact with institutional knowledge.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              <Card className="border-none shadow-md bg-white hover:translate-y-[-4px] transition-transform">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">Secure Access</h3>
                  <p className="text-muted-foreground">Log in with your @neu.edu.ph account. Domain validation ensures only CICS students have access.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white hover:translate-y-[-4px] transition-transform">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">Advanced Search</h3>
                  <p className="text-muted-foreground">Filter documents by category, program, or keyword. Finding what you need has never been easier.</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white hover:translate-y-[-4px] transition-transform">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">AI Summaries</h3>
                  <p className="text-muted-foreground">Quickly understand long PDF documents with our integrated AI summarization tool.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-zinc-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-white font-medium">For Students</div>
                <h2 className="text-3xl font-headline font-bold text-primary">Your Academic Resource Center</h2>
                <ul className="grid gap-4 py-4">
                  <li className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span>Download program checklists and syllabus</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <span>Submit and track official inquiries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span>Stay updated with real-time announcements</span>
                  </li>
                </ul>
                <Link href="/login?role=student">
                  <Button className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 rounded-full px-8">Student Portal</Button>
                </Link>
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-zinc-800 px-3 py-1 text-sm text-white font-medium">For Admins</div>
                <h2 className="text-3xl font-headline font-bold text-zinc-900">Manage with Precision</h2>
                <ul className="grid gap-4 py-4 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center">
                      <Download className="h-4 w-4 text-zinc-900" />
                    </div>
                    <span>Bulk upload documents via drag-and-drop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-zinc-900" />
                    </div>
                    <span>Monitor usage analytics and download trends</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-zinc-900" />
                    </div>
                    <span>Manage student accounts and access levels</span>
                  </li>
                </ul>
                <Link href="/login?role=admin">
                  <Button variant="outline" className="w-full sm:w-auto border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white rounded-full px-8">Admin Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t bg-white">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 College of Informatics and Computing Studies (CICS). All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-sm hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-sm hover:underline underline-offset-4" href="#">
              Privacy Policy
            </Link>
            <Link className="text-sm hover:underline underline-offset-4" href="#">
              Contact CICS
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
