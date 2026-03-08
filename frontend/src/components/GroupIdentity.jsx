import { useState } from 'react'

export default function GroupIdentity({ value, onChange }) {
    const priorities = [{ key: 'low', label: 'Thấp' }, { key: 'medium', label: 'Trung bình' }, { key: 'high', label: 'Cao' }]

    return (
        <div className="card" style={{ minWidth: 260 }}>
            <h2 style={{ marginBottom: 4 }}>
                <span style={{ marginRight: 8 }}>️🥅</span>Thông tin nhóm
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div className="form-group">
                    <label>Tên nhóm</label>
                    <input
                        type="text"
                        placeholder="VD: Đội thu hoạch A"
                        value={value.groupName}
                        onChange={(e) => onChange({ ...value, groupName: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Danh mục</label>
                    <select
                        value={value.category}
                        onChange={(e) => onChange({ ...value, category: e.target.value })}
                    >
                        <option>Rang xay</option>
                        <option>Pha chế</option>
                        <option>Đóng gói</option>
                        <option>Kho vận</option>
                        <option>Bảo trì</option>
                        <option>Chất lượng</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Mức ưu tiên</label>
                    <div className="priority-group">
                        {priorities.map((p) => (
                            <button
                                key={p.key}
                                className={value.priority === p.key ? 'active' : ''}
                                onClick={() => onChange({ ...value, priority: p.key })}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
