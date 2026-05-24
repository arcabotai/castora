import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Heart, PawPrint } from "lucide-react"
import { PetOption } from "@prisma/client"
import { PetSelectionConfirmation } from "./PetSelectionConfirmation"
import { Button } from "../ui/button"

export default function PetOptionCard({ petOption }: { petOption: PetOption }) {
  const { name, species, traits, interests, pfp_url, description } = petOption
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)

  const handleSelectPet = () => {
    setIsConfirmationOpen(true)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Card
        className="overflow-hidden transition-all duration-300 bg-gradient-to-br from-white to-slate-100 border-slate-200"
      >
        <CardHeader className="px-4 flex flex-row justify-start items-center gap-x-12">
          <img className="w-32 h-32 ring-2 ring-slate-300 border-background rounded-full overflow-hidden shrink-0" src={pfp_url} alt={`${name} the ${species}`} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold tracking-tight">Traits</h3>
              <div className="flex flex-row flex-wrap justify-start gap-1">
                {traits.map((trait) => (
                  <Badge key={trait} variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors dark:border-slate-200">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col flex-wrap gap-1">
              <h3 className="text-sm font-medium text-muted-foreground">Interests</h3>
              <div className="flex flex-row flex-wrap gap-1">
                {interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-secondary-foreground border-secondary-foreground/20 hover:bg-secondary/10 transition-colors line-clamp-1 dark:border-slate-200">
                    <Heart className="w-3 h-3 mr-1 inline" />
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold leading-tight text-primary">{name}</h2>
            <p className="text-sm font-medium text-muted-foreground flex items-center">
              <PawPrint className="w-4 h-4 mr-1 inline" />
              {species}
            </p>
          </div>
          <div>
            <div className="flex flex-col text-sm text-muted-foreground space-y-1">
              {description.split(/(?<=[.!?])\s+/).map((sentence, index) => (
                <p key={index}>{sentence}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Button
        className="w-full"
        onClick={handleSelectPet}
      >
        Select
      </Button>
      <PetSelectionConfirmation
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        petOption={petOption}
      />
    </div>
  )
}
