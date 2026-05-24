import Link from 'next/link'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { AspectRatio } from '../ui/aspect-ratio'

export default function MapPromotionCard() {
  return (
    <Link href="/map" className="px-4 sm:px-6 lg:px-8">
      <Card className="overflow-hidden hover:opacity-90 transition-opacity bg-gray-900 text-gray-50 hover:bg-gray-900/90">
        <div className="relative">
          <AspectRatio ratio={4 / 1}>
            <img src="/map-screenshot.png" alt="Map promotion" className="w-full h-full object-cover" />
          </AspectRatio>
          <CardFooter className="flex justify-between items-center p-4 bg-card">
            <p className="text-sm font-medium">
              Explore the map of your friends
            </p>
            <ArrowRight className="h-4 w-4" />
          </CardFooter>
        </div>
      </Card>
    </Link>
  )
} 