'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
  gender: string
  color: string
  microchip_id?: string
  registration_number?: string
  owner_contact?: string
}

interface BatchQRCode {
  dog: Dog
  qrCodeUrl: string
}

export default function QRCodeBatchPrint() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDogs, setSelectedDogs] = useState<string[]>([])
  const [batchCodes, setBatchCodes] = useState<BatchQRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [printSize, setPrintSize] = useState('medium')

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

  const toggleDogSelection = (dogId: string) => {
    setSelectedDogs(prev => 
      prev.includes(dogId) 
        ? prev.filter(id => id !== dogId)
        : [...prev, dogId]
    )
  }

  const selectAllDogs = () => {
    setSelectedDogs(dogs.map(dog => dog.id))
  }

  const clearSelection = () => {
    setSelectedDogs([])
  }

  const generateBatchQRCodes = async () => {
    if (selectedDogs.length === 0) {
      alert('请先选择要生成二维码的狗狗')
      return
    }

    setGenerating(true)
    const batchResults: BatchQRCode[] = []

    try {
      for (const dogId of selectedDogs) {
        const dog = dogs.find(d => d.id === dogId)
        if (!dog) continue

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const viewUrl = `${baseUrl}/dog/${dog.id}`
        
        // 直接使用URL链接作为二维码内容，兼容微信支付宝扫码
        const qrContent = viewUrl
        const qrCodeUrl = await QRCode.toDataURL(qrContent, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        batchResults.push({
          dog,
          qrCodeUrl
        })
      }

      setBatchCodes(batchResults)
    } catch (error) {
      console.error('批量生成二维码失败:', error)
      alert('生成二维码失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const printBatchQRCodes = () => {
    if (batchCodes.length === 0) {
      alert('请先生成二维码')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const sizeConfig = {
      small: { 
        width: '180px', 
        height: '120px', 
        qrSize: '80px', 
        fontSize: '10px',
        cols: '4'
      },
      medium: { 
        width: '240px', 
        height: '160px', 
        qrSize: '100px', 
        fontSize: '12px',
        cols: '3'
      },
      large: { 
        width: '300px', 
        height: '200px', 
        qrSize: '120px', 
        fontSize: '14px',
        cols: '2'
      }
    }

    const config = sizeConfig[printSize as keyof typeof sizeConfig]

    const qrCodeItems = batchCodes.map(({ dog, qrCodeUrl }) => `
      <div class="qr-item">
        <div class="qr-info">
          <h3>${dog.name}</h3>
          <p>${dog.breed} | ${dog.gender === 'male' ? '公' : '母'}</p>
          ${dog.microchip_id ? `<p>芯片: ${dog.microchip_id}</p>` : ''}
        </div>
        <div class="qr-code">
          <img src="${qrCodeUrl}" alt="${dog.name}二维码" />
        </div>
        <div class="qr-footer">
          <p>扫描查看详情</p>
        </div>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>批量二维码打印</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            
            .print-header h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            
            .print-header p {
              font-size: 14px;
              color: #666;
            }
            
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(${config.cols}, 1fr);
              gap: 20px;
              justify-items: center;
            }
            
            .qr-item {
              width: ${config.width};
              height: ${config.height};
              border: 1px solid #000;
              padding: 10px;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: white;
              page-break-inside: avoid;
            }
            
            .qr-info h3 {
              font-size: ${config.fontSize};
              font-weight: bold;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .qr-info p {
              font-size: calc(${config.fontSize} * 0.8);
              color: #666;
              margin-bottom: 1px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .qr-code {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 5px 0;
            }
            
            .qr-code img {
              width: ${config.qrSize};
              height: ${config.qrSize};
              border: 1px solid #ddd;
            }
            
            .qr-footer p {
              font-size: calc(${config.fontSize} * 0.7);
              color: #888;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
              
              .print-header {
                margin-bottom: 20px;
              }
              
              .qr-grid {
                gap: 15px;
              }
              
              .qr-item {
                border: 1px solid #000;
              }
            }
            
            @page {
              margin: 15mm;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>宠物二维码标签</h1>
            <p>宠物繁育管理系统 | 生成时间：${new Date().toLocaleString('zh-CN')}</p>
          </div>
          
          <div class="qr-grid">
            ${qrCodeItems}
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const downloadBatchAsZip = async () => {
    if (batchCodes.length === 0) {
      alert('请先生成二维码')
      return
    }

    // 这里可以集成 JSZip 库来创建ZIP文件
    // 为了简化，我们提供单独下载的功能
    batchCodes.forEach(({ dog, qrCodeUrl }, index) => {
      const link = document.createElement('a')
      link.download = `${dog.name}_二维码.png`
      link.href = qrCodeUrl
      document.body.appendChild(link)
      
      setTimeout(() => {
        link.click()
        document.body.removeChild(link)
      }, index * 100) // 错开下载时间
    })
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
      {/* 控制面板 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">批量二维码生成</h2>
            <p className="text-sm text-gray-500 mt-1">
              选择狗狗批量生成二维码，支持打印和下载
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 打印尺寸选择 */}
            <select
              value={printSize}
              onChange={(e) => setPrintSize(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="small">小号标签 (4列)</option>
              <option value="medium">中号标签 (3列)</option>
              <option value="large">大号标签 (2列)</option>
            </select>
            
            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <button
                onClick={selectAllDogs}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                全选
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        {/* 选择统计 */}
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-800">
            已选择 <strong>{selectedDogs.length}</strong> 只狗狗
          </span>
          <div className="flex space-x-2">
            <button
              onClick={generateBatchQRCodes}
              disabled={selectedDogs.length === 0 || generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span>📱</span>
                  <span>生成二维码</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 狗狗选择列表 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">选择狗狗</h3>
        
        {dogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🐕</div>
            <p className="text-gray-500">暂无狗狗信息</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedDogs.includes(dog.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleDogSelection(dog.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    selectedDogs.includes(dog.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedDogs.includes(dog.id) && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {dog.name.charAt(0)}
                      </div>
                      <h4 className="font-semibold text-gray-900">{dog.name}</h4>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{dog.breed} | {dog.gender === 'male' ? '公' : '母'}</p>
                      <p>{calculateAge(dog.birth_date)}</p>
                      {dog.microchip_id && (
                        <p className="text-xs text-blue-600">芯片: {dog.microchip_id}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 批量二维码预览 */}
      {batchCodes.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              二维码预览 ({batchCodes.length} 个)
            </h3>
            
            <div className="flex space-x-3">
              <button
                onClick={downloadBatchAsZip}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>💾</span>
                <span>批量下载</span>
              </button>
              <button
                onClick={printBatchQRCodes}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>🖨️</span>
                <span>批量打印</span>
              </button>
            </div>
          </div>
          
          {/* 预览网格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {batchCodes.map(({ dog, qrCodeUrl }) => (
              <div key={dog.id} className="border rounded-lg p-3 text-center">
                <div className="mb-2">
                  <img 
                    src={qrCodeUrl} 
                    alt={`${dog.name}的二维码`}
                    className="w-20 h-20 mx-auto border"
                  />
                </div>
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {dog.name}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                  {dog.breed}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用指南 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          <span className="text-2xl mr-2">📋</span>
          批量打印指南
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">🖨️ 打印设置</h4>
            <ul className="space-y-1">
              <li>• 推荐使用A4纸张打印</li>
              <li>• 设置页边距为15mm</li>
              <li>• 选择合适的标签尺寸</li>
              <li>• 建议使用激光打印机</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🏷️ 应用建议</h4>
            <ul className="space-y-1">
              <li>• 小号适合制作项圈标签</li>
              <li>• 中号适合证件和档案</li>
              <li>• 大号适合展示和宣传</li>
              <li>• 可配合塑封机提高耐用性</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-1">🚀 扫码体验优化</h4>
          <p className="text-sm text-blue-700">
            现在所有二维码都完美兼容微信、支付宝扫描，直接跳转到包含健康、成长、繁殖等全档案的详细页面，信息更丰富实用！
          </p>
        </div>
      </div>
    </div>
  )
} 