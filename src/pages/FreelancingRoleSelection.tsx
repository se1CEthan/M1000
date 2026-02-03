import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function FreelancingRoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'business' | null>(null);

  const handleRoleSelection = (role: 'freelancer' | 'business') => {
    setSelectedRole(role);
    // Navigate to respective services after a brief delay
    setTimeout(() => {
      if (role === 'freelancer') {
        navigate('/freelancer-dashboard');
      } else {
        navigate('/business-dashboard');
      }
    }, 500);
  };

  const roles = [
    {
      id: 'freelancer' as const,
      title: 'I\'m a Freelancer',
      description: 'Offer your skills and services to businesses worldwide',
      icon: Users,
      features: [
        'Create a professional profile',
        'Browse and apply to projects',
        'Secure PesaPal payments',
        'Build your reputation',
        'Set your own rates'
      ],
      color: 'primary',
      gradient: 'from-primary/20 to-primary/5'
    },
    {
      id: 'business' as const,
      title: 'I\'m a Business',
      description: 'Find and hire talented freelancers for your projects',
      icon: Building2,
      features: [
        'Post project requirements',
        'Review freelancer proposals',
        'Escrow-based payments',
        'Project management tools',
        'Quality assurance'
      ],
      color: 'accent',
      gradient: 'from-accent/20 to-accent/5'
    }
  ];

  return (
    <MainLayout>
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background effects */}
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
        <div className="absolute inset-0 bg-grid opacity-20" />

        <div className="container relative mx-auto px-4 sm:px-6">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={item}
              className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              Choose Your
              <span className="mt-2 block gradient-text">Freelancing Path</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Whether you're looking to offer your services or hire talented professionals,
              we've got the perfect platform for you.
            </motion.p>

            <motion.div
              variants={container}
              className="grid gap-8 md:grid-cols-2"
            >
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                
                return (
                  <motion.div key={role.id} variants={item}>
                    <Card 
                      className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        isSelected 
                          ? 'ring-2 ring-primary shadow-xl scale-105' 
                          : 'hover:scale-105'
                      }`}
                      onClick={() => handleRoleSelection(role.id)}
                    >
                      {/* Background gradient */}
                      <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${role.gradient} opacity-50`} />
                      
                      <CardHeader className="relative text-center pb-4">
                        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-${role.color}/10`}>
                          <Icon className={`h-8 w-8 text-${role.color}`} />
                        </div>
                        <CardTitle className="text-2xl">{role.title}</CardTitle>
                        <CardDescription className="text-base">
                          {role.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="relative">
                        <ul className="space-y-3 mb-6">
                          {role.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          className={`w-full group ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : `bg-${role.color} text-${role.color}-foreground hover:bg-${role.color}/90`
                          }`}
                          disabled={isSelected}
                        >
                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              <span>Setting up...</span>
                            </div>
                          ) : (
                            <>
                              Get Started
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.p
              variants={item}
              className="mt-12 text-sm text-muted-foreground"
            >
              Secure payments · Global reach · Professional tools · 24/7 support
            </motion.p>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}