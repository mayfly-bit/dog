'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
  gender: string
  color: string
  weight?: number
  microchip_id?: string
  registration_number?: string
  owner_contact?: string
  created_at: string
}

interface QRCodeData {
  id: string
  name: string
  breed: string
  birth_date: string
  gender: string
  color: string
  microchip_id?: string
  registration_number?: string
  contact: string
  view_url: string
}

export default function QRCodeGenerator() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchDogs()
  }, [])

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCodeData = (dog: Dog): QRCodeData => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const viewUrl = `${baseUrl}/dog/${dog.id}`
    
    return {
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      birth_date: dog.birth_date,
      gender: dog.gender,
      color: dog.color,
      microchip_id: dog.microchip_id,
      registration_number: dog.registration_number,
      contact: dog.owner_contact || '联系系统管理员',
      view_url: viewUrl
    }
  }

  const generateQRCode = async (dog: Dog) => {
    setGenerating(true)
    try {
      const qrData = generateQRCodeData(dog)
      setQrCodeData(qrData)
      
      // 直接使用URL链接作为二维码内容，兼容微信支付宝扫码
      const qrContent = qrData.view_url

      // 生成二维码
      const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeUrl(qrCodeDataUrl)
      setSelectedDog(dog)
    } catch (error) {
      console.error('生成二维码失败:', error)
      alert('生成二维码失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedDog) return

    const link = document.createElement('a')
    link.download = `${selectedDog.name}_二维码.png`
    link.href = qrCodeUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printQRCode = () => {
    if (!qrCodeUrl || !selectedDog) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedDog.name} - 二维码</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #000;
              padding: 20px;
              border-radius: 10px;
              background: white;
            }
            .qr-info {
              margin-bottom: 20px;
            }
            .qr-info h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .qr-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .qr-footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-info">
              <h2>${selectedDog.name}</h2>
              <p><strong>品种：</strong>${selectedDog.breed}</p>
              <p><strong>性别：</strong>${selectedDog.gender === 'male' ? '公' : '母'}</p>
              <p><strong>颜色：</strong>${selectedDog.color}</p>
              ${selectedDog.microchip_id ? `<p><strong>芯片号：</strong>${selectedDog.microchip_id}</p>` : ''}
              ${selectedDog.registration_number ? `<p><strong>注册号：</strong>${selectedDog.registration_number}</p>` : ''}
            </div>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="二维码" style="width: 200px; height: 200px;" />
            </div>
            <div class="qr-footer">
              <p>扫描二维码获取详细信息</p>
              <p>宠物繁育管理系统</p>
            </div>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    const diffTime = today.getTime() - birth.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} 天`
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} 个月`
    } else {
      const years = Math.floor(diffDays / 365)
      const months = Math.floor((diffDays % 365) / 30)
      return `${years} 岁 ${months} 个月`
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 狗狗选择区域 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">选择狗狗</h2>
        
        {dogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🐕</div>
            <p className="text-gray-500">暂无狗狗信息</p>
            <p className="text-sm text-gray-400 mt-2">请先添加狗狗信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedDog?.id === dog.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => generateQRCode(dog)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {dog.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{dog.name}</h3>
                    <p className="text-sm text-gray-600">{dog.breed}</p>
                    <p className="text-xs text-gray-400">
                      {calculateAge(dog.birth_date)}
                    </p>
                  </div>
                </div>
                
                {generating && selectedDog?.id === dog.id && (
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">生成中...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 二维码显示区域 */}
      {qrCodeUrl && selectedDog && qrCodeData && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedDog.name} 的专属二维码
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 二维码展示 */}
            <div className="text-center">
              <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                <img 
                  src={qrCodeUrl} 
                  alt={`${selectedDog.name}的二维码`}
                  className="w-64 h-64 mx-auto"
                />
                <p className="mt-4 text-sm text-gray-500">
                  扫描二维码获取狗狗详细信息
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>💾</span>
                  <span>下载</span>
                </button>
                <button
                  onClick={printQRCode}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>🖨️</span>
                  <span>打印</span>
                </button>
              </div>
            </div>
            
            {/* 狗狗信息展示 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">包含信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">姓名：</span>
                  <span className="font-medium">{qrCodeData.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">品种：</span>
                  <span className="font-medium">{qrCodeData.breed}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">性别：</span>
                  <span className="font-medium">
                    {qrCodeData.gender === 'male' ? '公' : '母'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">颜色：</span>
                  <span className="font-medium">{qrCodeData.color}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">出生日期：</span>
                  <span className="font-medium">
                    {new Date(qrCodeData.birth_date).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">年龄：</span>
                  <span className="font-medium">
                    {calculateAge(qrCodeData.birth_date)}
                  </span>
                </div>
                {qrCodeData.microchip_id && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">芯片号：</span>
                    <span className="font-medium">{qrCodeData.microchip_id}</span>
                  </div>
                )}
                {qrCodeData.registration_number && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">注册号：</span>
                    <span className="font-medium">{qrCodeData.registration_number}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">联系方式：</span>
                  <span className="font-medium">{qrCodeData.contact}</span>
                </div>
              </div>
              
              {/* 查看链接 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">在线查看链接：</p>
                <p className="text-xs text-blue-600 break-all font-mono bg-white p-2 rounded border">
                  {qrCodeData.view_url}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          使用说明
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">🔍 扫描功能</h4>
            <ul className="space-y-1">
              <li>• 完美兼容微信、支付宝扫码</li>
              <li>• 直接跳转到详细档案页面</li>
              <li>• 包含健康、成长、繁殖全档案</li>
              <li>• 支持手机分享和联系主人</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🎨 应用场景</h4>
            <ul className="space-y-1">
              <li>• 制作狗牌、项圈标签</li>
              <li>• 参赛证件、健康档案</li>
              <li>• 寄养、医院就诊识别</li>
              <li>• 走失找回、身份确认</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <h4 className="font-medium text-green-800 mb-1">✅ 扫码体验升级</h4>
          <p className="text-sm text-green-700">
            现在二维码直接链接到完整档案页面，包含该狗狗的所有健康记录、成长数据、繁殖信息和相关费用，信息更全面更实用！
          </p>
        </div>
      </div>
    </div>
  )
} 