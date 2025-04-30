
// src/app/privacy/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="bg-muted/50 p-6">
                    <CardTitle className="text-2xl font-bold text-foreground">Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-muted-foreground">
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

                    <p>
                        Welcome to SafeCrawl ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Service").
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Information We Collect</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>URLs Submitted for Analysis:</strong> We collect the URLs you submit to SafeCrawl for risk analysis. This data is essential for providing the core functionality of our service.</li>
                        <li><strong>Analysis Results:</strong> We store the results of the URL analyses, including risk assessments and associated metadata.</li>
                        <li><strong>User Feedback:</strong> If you provide feedback on analysis results, we collect the information you submit, including the URL in question and your comments. This helps us improve our AI models.</li>
                        <li><strong>Usage Data:</strong> We may automatically collect certain information when you access the Service, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Service. This is used for analytics and service improvement.</li>
                        <li><strong>Cookies:</strong> We may use cookies and similar tracking technologies to track activity on our Service and hold certain information. (Details about specific cookies would go here).</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-foreground pt-4">How We Use Your Information</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>To provide, operate, and maintain our Service.</li>
                        <li>To improve, personalize, and expand our Service.</li>
                        <li>To understand and analyze how you use our Service.</li>
                        <li>To develop new products, services, features, and functionality.</li>
                        <li>To train and improve our AI models for URL risk analysis.</li>
                        <li>To communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes (if applicable and consented to).</li>
                        <li>To find and prevent fraud and security issues.</li>
                    </ul>
                     <h3 className="text-lg font-semibold text-foreground pt-4">Sharing Your Information</h3>
                     <p>We do not sell your personal information. We may share information in the following limited circumstances:</p>
                     <ul className="list-disc list-inside space-y-1">
                         <li>With service providers who perform services for us (e.g., hosting, analytics), under confidentiality agreements.</li>
                         <li>To comply with legal obligations or respond to valid legal processes.</li>
                         <li>To protect and defend our rights or property.</li>
                         <li>In connection with a merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company.</li>
                         <li>Anonymized or aggregated data may be shared for research or statistical purposes.</li>
                     </ul>


                    <h3 className="text-lg font-semibold text-foreground pt-4">Data Security</h3>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your information. While we have taken reasonable steps to secure the information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Your Privacy Rights</h3>
                    <p>
                        Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Changes to This Privacy Policy</h3>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
                    </p>

                    <h3 className="text-lg font-semibold text-foreground pt-4">Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at [Your Contact Email/Link].
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

        