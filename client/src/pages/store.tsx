import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Coins, Zap, Crown, ShoppingCart } from "lucide-react";
import Navbar from "@/components/navbar";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";

// Stripe is optional for now - payment integration will be added later
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.warn("Stripe public key not configured. Store functionality will be limited.");
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentFormProps {
  amount: number;
  description: string;
  onSuccess: () => void;
}

const PaymentForm = ({ amount, description, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">{description}</h3>
        <p className="text-2xl font-bold text-primary">${amount}</p>
      </div>
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="button-pay"
      >
        {isProcessing ? "Processing..." : `Pay $${amount}`}
      </Button>
    </form>
  );
};

const CheckoutDialog = ({ 
  amount, 
  description, 
  children 
}: { 
  amount: number; 
  description: string; 
  children: React.ReactNode;
}) => {
  const [clientSecret, setClientSecret] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !clientSecret && stripePromise) {
      apiRequest("POST", "/api/create-payment-intent", { amount })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch(() => {
          console.error("Failed to create payment intent");
        });
    }
  }, [isOpen, amount, clientSecret]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Purchase</DialogTitle>
          <DialogDescription>
            Secure payment powered by Stripe
          </DialogDescription>
        </DialogHeader>
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              amount={amount}
              description={description}
              onSuccess={() => setIsOpen(false)}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function Store() {
  const { user, isAuthenticated } = useAuth();

  const coinPackages = [
    { coins: 50, price: 2, popular: false },
    { coins: 100, price: 3.5, popular: true },
    { coins: 200, price: 5, popular: false },
    { coins: 500, price: 15, popular: false },
    { coins: 1000, price: 25, popular: false },
  ];

  const advertiseBoosts = [
    { duration: "24 hours", price: 2, popular: false },
    { duration: "1 month", price: 10, popular: true },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-foreground">Authentication Required</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please login with Discord to access the Store and purchase coins, boosts, and premium features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      {/* Changed the gradient to reflect "Discord Communities" and removed purple emphasis */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/70 via-purple-700/70 to-blue-900/70 border-blue-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="inline-block p-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-400">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text">
                Store
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Purchase coins, boosts, and premium tools to enhance your Discord server experience!
              </p>
            </div>

            {/* Current Balance */}
            <div className="mt-6">
              <div className="inline-block bg-card border border-border rounded-xl px-6 py-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold text-foreground">
                    {(user as any)?.coins || 0} Coins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Coins Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-400 mb-4">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text mb-2">
              Coins
            </h2>
            <p className="text-muted-foreground">Purchase coins to unlock premium features and rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {coinPackages.map((pkg, index) => (
              <Card key={index} className={`relative bg-card border border-border rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 ${pkg.popular ? 'border-primary shadow-lg shadow-primary/20' : ''}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <Coins className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {pkg.coins} Coins
                  </CardTitle>
                  <CardDescription className="text-primary text-xl font-semibold">
                    ${pkg.price}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {stripePromise ? (
                    <CheckoutDialog 
                      amount={pkg.price}
                      description={`${pkg.coins} Coins Package`}
                    >
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:scale-105" data-testid={`button-buy-${pkg.coins}-coins`}>
                        Buy Now - ${pkg.price}
                      </Button>
                    </CheckoutDialog>
                  ) : (
                    <Button 
                      disabled 
                      className="w-full bg-gray-500 cursor-not-allowed" 
                      data-testid={`button-buy-${pkg.coins}-coins`}
                    >
                      Payment Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-16 bg-border" />

        {/* Advertise Boost Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-400 mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text mb-2">
              Advertise Boost
            </h2>
            <p className="text-muted-foreground">Boost your server visibility and attract more members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {advertiseBoosts.map((boost, index) => (
              <Card key={index} className={`bg-card border border-border rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 ${boost.popular ? 'border-primary shadow-lg shadow-primary/20' : ''}`}>
                {boost.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Best Value
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <Zap className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {boost.duration}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Advertise Boost
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary mb-2">
                      ${boost.price}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Priority placement in server listings
                    </p>
                  </div>
                  {stripePromise ? (
                    <CheckoutDialog 
                      amount={boost.price}
                      description={`${boost.duration} Advertise Boost`}
                    >
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:scale-105" data-testid={`button-buy-boost-${boost.duration.replace(' ', '-')}`}>
                        Purchase - ${boost.price}
                      </Button>
                    </CheckoutDialog>
                  ) : (
                    <Button 
                      disabled 
                      className="w-full bg-gray-500 cursor-not-allowed" 
                      data-testid={`button-buy-boost-${boost.duration.replace(' ', '-')}`}
                    >
                      Payment Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-16 bg-border" />

        {/* Premium Bot Tools Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-400 mb-4">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text mb-2">
              Premium Tools
            </h2>
            <p className="text-muted-foreground">Unlock advanced bot features and management tools</p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="bg-card border border-border rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 border-primary shadow-lg shadow-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Crown className="w-16 h-16 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Premium Bot Tools
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Advanced server management features
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary mb-4">
                    $8
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>✨ Advanced moderation tools</div>
                    <div>🔧 Custom bot configurations</div>
                    <div>📊 Detailed analytics dashboard</div>
                    <div>🚀 Priority support</div>
                  </div>
                </div>
                {stripePromise ? (
                  <CheckoutDialog 
                    amount={8}
                    description="Premium Bot Tools"
                  >
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:scale-105" data-testid="button-buy-premium-tools">
                      Get Premium - $8
                    </Button>
                  </CheckoutDialog>
                ) : (
                  <Button 
                    disabled 
                    className="w-full bg-gray-500 cursor-not-allowed" 
                    data-testid="button-buy-premium-tools"
                  >
                    Payment Not Available
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <i className="fab fa-discord text-2xl text-primary"></i>
                <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Smart Serve</span>
              </div>
              <p className="text-muted-foreground">
                Smart communities, smarter connections. Discover the best Discord servers and bots for your community.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Browse</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Discord Servers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Discord Bots</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Popular</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Discord Server</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Smart Serve. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
