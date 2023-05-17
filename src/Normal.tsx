import React, { useState, useRef, useEffect } from 'react';

type Table = {
  id: string;
  name: string;
  x: number;
  y: number;
  parentId?: string;
};

type Connection = {
  id: string;
  sourceTableId: string;
  targetTableId: string;
};

type DbDesignerProps = {};

const DbDesigner: React.FC<DbDesignerProps> = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [draggedDot, setDraggedDot] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableName, setEditingTableName] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const designerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      if (draggedTable) {
        setDraggedTable(null);
      }
      if (draggedDot) {
        setDraggedDot(null);
      }
      setIsConnecting(false);
    };

    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTable, draggedDot]);



  const handleAddTable = (event: React.MouseEvent<HTMLButtonElement>) => {
    const newTable: Table = {
      id: String(tables.length + 1),
      name: 'New Table',
      x: event.clientX / zoomLevel,
      y: event.clientY / zoomLevel,
    };
  
    setTables((prevTables) => [...prevTables, newTable]);
  
    if (draggedDot && isConnecting) {
      const newConnection: Connection = {
        id: `${draggedDot}-${newTable.id}`,
        sourceTableId: draggedDot,
        targetTableId: newTable.id,
      };
  
      setConnections((prevConnections) => [...prevConnections, newConnection]);
  
      // Update the position of the parent table if it exists
      const parentTable = tables.find((table) => table.id === draggedDot);
      if (parentTable) {
        setTables((prevTables) =>
          prevTables.map((table) =>
            table.id === parentTable.id
              ? { ...table, x: parentTable.x, y: parentTable.y }
              : table
          )
        );
      }
    }
  };
  
  const renderConnection = (connection: Connection) => {
    const sourceTable = tables.find((table) => table.id === connection.sourceTableId);
    const targetTable = tables.find((table) => table.id === connection.targetTableId);
  
    if (!sourceTable || !targetTable) {
      return null;
    }
  
    const sourceX = sourceTable.x * zoomLevel + 50; // Adjust for dot position
    const sourceY = sourceTable.y * zoomLevel + 50; // Adjust for dot position
    const targetX = targetTable.x * zoomLevel + 50; // Adjust for dot position
    const targetY = targetTable.y * zoomLevel + 50; // Adjust for dot position
  
    return (
      <svg key={connection.id} style={{ position: 'absolute', zIndex: -1 }}>
        <line x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} stroke="#000" />
      </svg>
    );
  };
  



  
  const handleMouseUpDot = (tableId: string) => {
    if (isConnecting && draggedDot && draggedDot !== tableId) {
      const newConnection: Connection = {
        id: `${draggedDot}-${tableId}`,
        sourceTableId: draggedDot,
        targetTableId: tableId,
      };
  
      setConnections((prevConnections) => [...prevConnections, newConnection]);
    }
  
    setDraggedDot(null);
    setIsConnecting(false);
  };

  const handleMouseDownTable = (table: Table) => {
    setDraggedTable(table);
  };

  const handleMouseMoveTable = (event: React.MouseEvent<HTMLDivElement>) => {
    if (draggedTable && designerRef.current) {
      const rect = designerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - 50) / zoomLevel; // adjust for table width
      const y = (event.clientY - rect.top - 25) / zoomLevel; // adjust for table height

      setTables((prevTables) =>
        prevTables.map((table) => (table.id === draggedTable.id ? { ...table, x, y } : table))
      );
    }
  };

  const handleMouseDownDot = (tableId: string) => {
    setDraggedDot(tableId);
    setIsConnecting(true);
  };



  const handleMouseOverDot = (tableId: string) => {
    if (isConnecting && draggedDot && draggedDot !== tableId) {
      setDraggedDot(tableId);
    }
  };

  const handleTableDoubleClick = (tableId: string, tableName: string) => {
    setEditingTableId(tableId);
    setEditingTableName(tableName);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTableName(event.target.value);
  };

  const handleInputBlur = () => {
    if (editingTableId && editingTableName.trim() !== '') {
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === editingTableId ? { ...table, name: editingTableName } : table
        )
      );
    }

    setEditingTableId(null);
  };

  const handleDeleteTable = (tableId: string) => {
    setTables((prevTables) => prevTables.filter((table) => table.id !== tableId));
    setConnections((prevConnections) =>
      prevConnections.filter(
        (connection) => connection.sourceTableId !== tableId && connection.targetTableId !== tableId
      )
    );
  };

  const handleZoomIn = () => {
    setZoomLevel((prevZoomLevel) => prevZoomLevel + 0.1);
  };

  const handleZoomOut = () => {
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.1, 0.1));
  };

  const renderTable = (table: Table) => {
    const tableStyle: React.CSSProperties = {
      position: 'absolute',
      left: table.x * zoomLevel,
      top: table.y * zoomLevel,
      border: '1px solid #000',
      background: '#fff',
      padding: '8px',
      cursor: 'move',
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'top left',
    };
  
    const isEditing = editingTableId === table.id;
  
    const addChildrenHandler = () => {
      const newTable: Table = {
        id: String(tables.length + 1),
        name: 'New Table',
        x: table.x + 100,
        y: table.y + 100,
        parentId: table.id,
      };
  
      setTables((prevTables) => [...prevTables, newTable]);
  
      const newConnection: Connection = {
        id: `${table.id}-${newTable.id}`,
        sourceTableId: table.id,
        targetTableId: newTable.id,
      };
  
      setConnections((prevConnections) => [...prevConnections, newConnection]);
    };
  
    const deleteTableHandler = () => {
      handleDeleteTable(table.id);
    };
  
    return (
      <div
        key={table.id}
        style={tableStyle}
        onMouseDown={() => handleMouseDownTable(table)}
        onMouseMove={handleMouseMoveTable}
        onDoubleClick={() => handleTableDoubleClick(table.id, table.name)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editingTableName}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            autoFocus
          />
        ) : (
          <div>
            <h3>{table.name}</h3>
            <button className="add-children-button" onClick={addChildrenHandler}>
              Add Children
            </button>
            <button className="delete-button" onClick={deleteTableHandler}>
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };
  

 

  return (
    <div>
      <div className="toolbar">
        <button onClick={handleAddTable}>Add Table</button>
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
      </div>
      <div
        ref={designerRef}
        className="designer"
        style={{ width: '800px', height: '600px', position: 'relative' }}
      >
        {tables.map(renderTable)}
        {connections.map(renderConnection)}
      </div>
    </div>
  );
};

export default DbDesigner;
