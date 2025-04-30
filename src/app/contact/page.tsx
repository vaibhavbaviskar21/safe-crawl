
// src/app/contact/page.tsx
"use client"; // Need client component for form handling

import { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // --- Placeholder for actual form submission logic ---
        // In a real app, you would send this data to a backend API endpoint
        console.log('Form submitted:', { name, email, message });
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        // --- End of placeholder ---

        setIsSubmitting(false);
        // Reset form
        setName('');
        setEmail('');
        setMessage('');

        toast({
            title: "Message Sent!",
            description: "Thank you for contacting us. We'll get back to you soon.",
        });
    };

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="bg-muted/50 p-6">
                    <CardTitle className="text-2xl font-bold text-foreground">Contact Us</CardTitle>
                    <CardDescription>Have questions or feedback? Send us a message!</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-foreground">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                required
                                className="bg-background" // Ensure consistent input styling
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-foreground">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Your message here..."
                                value={message}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                                required
                                rows={5}
                                className="bg-background"
                            />
                        </div>
                        <div>
                            <Button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Message'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

          