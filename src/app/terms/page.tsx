
// src/app/terms/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="bg-muted/50 p-6">
                    <CardTitle className="text-2xl font-bold text-foreground">Terms of Service</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-muted-foreground">
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

                    <p>
                        Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the SafeCrawl website and services (the "Service") operated by [Your Company Name/You] ("us", "we", or "our").
                    </p>

                    <p>
                        Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who wish to access or use the Service. By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you do not have permission to access the Service.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Use of Service</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>SafeCrawl provides URL risk analysis for informational purposes only. While we strive for accuracy, we cannot guarantee that the analysis is always correct or complete.</li>
                        <li>You agree not to use the Service for any unlawful purpose or in any way that could harm the Service or impair anyone else's use of it.</li>
                        <li>You are responsible for the URLs you submit for analysis. Do not submit URLs that you know contain illegal content or violate third-party rights.</li>
                        <li>We reserve the right to modify or discontinue the Service at any time without notice.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Intellectual Property</h3>
                    <p>
                        The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of [Your Company Name/You] and its licensors. The Service is protected by copyright, trademark, and other laws of both the [Your Country] and foreign countries.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Disclaimer of Warranties</h3>
                    <p>
                        The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Your use of the Service is at your sole risk. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
                    </p>
                    <p>
                       [Your Company Name/You] does not warrant that a) the Service will function uninterrupted, secure, or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements or expectations. The risk assessment provided is based on AI analysis and should be used as one tool among others for evaluating online safety.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Limitation of Liability</h3>
                    <p>
                        In no event shall [Your Company Name/You], nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
                    </p>


                    <h3 className="text-lg font-semibold text-foreground pt-4">Governing Law</h3>
                    <p>
                        These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction, e.g., State of California, USA], without regard to its conflict of law provisions.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Changes</h3>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Contact Us</h3>
                    <p>
                        If you have any questions about these Terms, please contact us at [Your Contact Email/Link].
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

         