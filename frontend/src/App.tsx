import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <Heading level={1} className="text-primary-600 mb-2">
          ÇekSenet
        </Heading>
        <Text className="text-gray-600 mb-6">
          Çek/Senet Takip Sistemi kurulumu tamamlandı.
        </Text>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge color="blue">Portföy</Badge>
          <Badge color="purple">Bankada</Badge>
          <Badge color="orange">Ciro</Badge>
          <Badge color="green">Tahsil</Badge>
          <Badge color="red">Karşılıksız</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button color="dark">Giriş Yap</Button>
          <Button outline>İptal</Button>
        </div>
      </div>
    </div>
  )
}

export default App
