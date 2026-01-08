import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, Mail, Phone, Globe } from "lucide-react"

export function AboutDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-[#2e7d32]">
                    <Info className="h-4 w-4" />
                    About
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#2e7d32]">About MyKitchen</DialogTitle>
                    <DialogDescription>
                        A variety-inspired open source cookbook.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <p className="text-gray-600">
                        Im Seth Makori, a passionate foodist. I made this for food lovers who believe that variety is the spice of life.
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Globe className="h-4 w-4 text-[#2e7d32]" />
                            <a href="https://codewithseth.co.ke" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#2e7d32]">
                                codewithseth.co.ke
                            </a>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                            <Mail className="h-4 w-4 text-[#2e7d32]" />
                            <a href="mailto:bellarinseth@gmail.com" className="hover:underline hover:text-[#2e7d32]">
                                bellarinseth@gmail.com
                            </a>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone className="h-4 w-4 text-[#2e7d32]" />
                            <a href="tel:+254114627400" className="hover:underline hover:text-[#2e7d32]">
                                +254 114 627 400
                            </a>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                        "Come let's make them onions cry in a happy mood"
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
